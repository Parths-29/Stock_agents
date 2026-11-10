module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0D1B2A",
        surface: "#1B263B",
        cream: "#F4F1DE",
        coral: "#FF6F61",
      },
      boxShadow: { coral: "4px 4px 0 #FF6F61", cream: "4px 4px 0 #F4F1DE" },
    },
  },
  plugins: [],
};
