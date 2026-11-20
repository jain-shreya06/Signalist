import { inngest } from "@/lib/inngest/client";
import { NEWS_SUMMARY_EMAIL_PROMPT, WELCOME_EMAIL_PROMPT } from "@/lib/inngest/prompts";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "@/lib/nodemailer";
import { getAllUsersForNewsEmail } from "@/lib/data/users";
import { getWatchlistSymbolsByEmail } from "@/lib/data/watchlist";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";

export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-3.5-flash-lite" }),
      body: {
        contents: [{ role: "user", parts: [{ text: WELCOME_EMAIL_PROMPT }] }],
      },
    });

    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const intro = (part && "text" in part ? part.text : null)
        || "Thanks for joining Signalist. You now have the tools to follow the stock market.";

      return sendWelcomeEmail({
        email: event.data.email,
        name: event.data.name,
        intro,
      });
    });

    return { success: true, message: "Welcome email sent successfully." };
  },
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary" },
  [{ event: "app/send.daily.news" }, { cron: "0 12 * * *" }],
  async ({ step }) => {
    const users = await step.run("get-all-users", getAllUsersForNewsEmail);
    if (users.length === 0) return { success: false, message: "No users found for news email." };

    const results = await step.run("fetch-user-news", async () => {
      const perUser: Array<{ user: UserForNewsEmail; articles: MarketNewsArticle[] }> = [];
      for (const user of users) {
        try {
          const symbols = await getWatchlistSymbolsByEmail(user.email);
          let articles = (await getNews(symbols)).slice(0, 6);
          if (articles.length === 0) articles = (await getNews()).slice(0, 6);
          perUser.push({ user, articles });
        } catch {
          console.error("Daily news preparation failed for one recipient.");
          perUser.push({ user, articles: [] });
        }
      }
      return perUser;
    });

    const summaries: Array<{ user: UserForNewsEmail; newsContent: string }> = [];
    for (const { user, articles } of results) {
      if (articles.length === 0) {
        console.error("Daily news skipped because no verified market articles were available.");
        continue;
      }

      try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
          "{{newsData}}",
          JSON.stringify(articles, null, 2),
        );
        const response = await step.ai.infer("summarize-news-" + user.id, {
          model: step.ai.models.gemini({ model: "gemini-3.5-flash-lite" }),
          body: { contents: [{ role: "user", parts: [{ text: prompt }] }] },
        });
        const part = response.candidates?.[0]?.content?.parts?.[0];
        const newsContent = part && "text" in part ? part.text : null;
        if (newsContent?.trim()) summaries.push({ user, newsContent });
        else console.error("Daily news summary skipped because Gemini returned no content.");
      } catch {
        console.error("Gemini failed to summarize a daily news digest.");
      }
    }

    await step.run("send-news-emails", async () => {
      await Promise.all(summaries.map(({ user, newsContent }) =>
        sendNewsSummaryEmail({
          email: user.email,
          date: getFormattedTodayDate(),
          newsContent,
        }),
      ));
    });

    return {
      success: true,
      message: "Daily news summaries sent to " + summaries.length + " recipients.",
    };
  },
);
