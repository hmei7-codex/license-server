export default {
  async fetch(request, env) {
    const value = await env.LICENSES.get("NEO-123456");

    return Response.json({
      found: value !== null,
      value
    });
  }
}
