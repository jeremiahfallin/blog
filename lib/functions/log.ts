export const log = (namespace: string, message: string) => {
  if (process.env.NODE_ENV === "development")
    console.log(`${namespace.padEnd(5, " ")} - ${message}`);
};
