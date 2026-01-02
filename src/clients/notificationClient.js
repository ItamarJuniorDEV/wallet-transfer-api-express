export const notificationClient = {
  async notify() {
    return {
      status: "success",
      data: {
        message: "Sent"
      }
    };
  },
};