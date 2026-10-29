export const options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "RiskAtlas Express API with Swagger",
      version: "0.1.0",
      description: "This is a risk management API for the RiskAtlas platform",
      license: {
        name: "MIT",
        url: "https://spdx.org/licenses/MIT.html",
      },
      contact: {
        name: "RiskAtlas",
        url: "https://riskatlas.com",
        email: "info@email.com",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
      },
    ],
  },
  apis: ["./src/**/*.route.ts"],
};
