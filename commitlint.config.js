module.exports = {
  extends: ["@commitlint/config-conventional"],
  formatter: "@commitlint/format",
  prompt: {
    messages: {},
    questions: {
      type: {
        description: "please input type:",
      },
    },
  },
};
