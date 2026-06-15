export default {
  async fetch(request, env) {
    return Response.json({
      env_keys: Object.keys(env)
    });
  }
}
