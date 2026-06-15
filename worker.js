const LICENSES = {
  "NEO-123456": {
    status: "active",
    expire: "2027-01-01"
  },

  "NEO-999999": {
    status: "inactive",
    expire: "2027-01-01"
  }
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/check") {
      const license = url.searchParams.get("license");

      if (!license) {
        return Response.json({
          success: false,
          message: "license required"
        });
      }

      const data = LICENSES[license];

      if (!data) {
        return Response.json({
          success: false,
          message: "license not found"
        });
      }

      return Response.json({
        success: true,
        license,
        status: data.status,
        expire: data.expire
      });
    }

    return new Response("NeoCloud License Server v1");
  }
}
