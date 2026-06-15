export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (!key) {
      return Response.json({
        valid: false,
        message: "License key required"
      });
    }

    const data = await env.LICENSES.get(key);

    if (!data) {
      return Response.json({
        valid: false,
        message: "License not found"
      });
    }

    return Response.json({
      valid: true,
      license: JSON.parse(data)
    });
  }
}
