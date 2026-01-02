export const authorizationClient = {
  async check() {
    return {
      status: "success",
      data: { authorization: true },
    };
  },
};