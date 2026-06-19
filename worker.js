function randomKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "NEO-";

  for (let i = 0; i < 6; i++) {
    result += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return result;
}

function generateToken() {
  return Math.random().toString(36).substring(2) +
         Date.now().toString(36);
}

const ADMIN_USER = "neocloude";

export default {
  async fetch(request, env) {
    const ADMIN_KEY = env.ADMIN_KEY;
    const SHRINKEARN_API = env.SHRINKEARN_API;
    const BOT_TOKEN = env.BOT_TOKEN;
    const url = new URL(request.url);
    // ==========================
    // CREATE TOKEN
    // ==========================
    if (url.pathname === "/token") {

      const token = generateToken();

      await env.TOKENS.put(
        token,
        JSON.stringify({
          created: Date.now()
        }),
        {
          expirationTtl: 3600
        }
      );

      return Response.json({
        success: true,
        token
      });
    }
    


    // ==========================
    // CREATE SHRINKEARN LINK
    // ==========================
    if (url.pathname === "/create-link") {

      const chatId = url.searchParams.get("chat_id");

      if (!chatId) {
        return Response.json({
          success: false,
          message: "chat_id required"
        });
      }

      const token = generateToken();

      await env.TOKENS.put(
        token,
        JSON.stringify({
          created: Date.now(),
          chatId
        }),
        {
          expirationTtl: 3600
        }
      );

      const targetUrl =
        `https://vip.neolaze.workers.dev/verify?token=${token}`;

      const apiUrl =
    `https://shrinkearn.com/api?api=${SHRINKEARN_API}&url=${encodeURIComponent(targetUrl)}`;

      try {

        const response = await fetch(apiUrl);

        if (!response.ok) {
          return Response.json({
            success: false,
            message: `ShrinkEarn HTTP ${response.status}`
          });
        }

        const result = await response.text();

        let data;

        try {
          data = JSON.parse(result);
        } catch {

          return Response.json({
            success: false,
            message: "ShrinkEarn invalid response",
            raw: result
          });

        }

        const shortlink =
          data.shortenedUrl ||
          data.shortened_url ||
          data.shortlink ||
          null;

        if (!shortlink) {

          return Response.json({
            success: false,
            message: "ShrinkEarn gagal membuat link",
            raw: data
          });

        }

        return Response.json({
          success: true,

          token: token,

          verify:
          `https://vip.neolaze.workers.dev/verify?token=${token}`,

          shrinkearn: shortlink
        });

    } catch (e) {

      return Response.json({
        success: false,
        message: e.message
        });

      }

    }
           
    // ==========================
    // SUCCESS
    // ==========================
    if (url.pathname === "/success") {

      const token = url.searchParams.get("token");

      if (!token) {
        return Response.json({
          success: false,
          message: "Token required"
        });
      }

      const tokenData = await env.TOKENS.get(token);
      
      if (!tokenData) {
        return Response.json({
          success: false,
          message: "Invalid token"
        });
      }
      const tokenInfo = JSON.parse(tokenData);
      const chatId = tokenInfo.chatId;

      await env.TOKENS.delete(token);

      const key = randomKey();

      const expire = new Date(
        Date.now() + (5 * 60 * 60 * 1000)
      );

      const data = {
        status: "active",
        created: new Date().toISOString(),
        expire: expire.toISOString()
      };

      await env.LICENSES.put(
        key,
        JSON.stringify(data)
      );
      await env.USERS.put(
        chatId,
        JSON.stringify({
          key,
          expire: data.expire
        })
      );

      if (chatId) {
        await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              chat_id: chatId,
              text:
        `✅ License Created

      Key: ${key}
      Expire: ${data.expire}`
            })
          }
        );
      }

      return new Response(
        "Verification Success. License sent to Telegram."
      );
    }
    // ==========================
    // REGISTER LICENSE
    // ==========================
    if (url.pathname === "/register") {

      const user = url.searchParams.get("user");
      const admin = url.searchParams.get("admin");

      const days = parseInt(
        url.searchParams.get("days") || "30"
      );

      if (user !== ADMIN_USER || admin !== ADMIN_KEY) {
        return Response.json({
          success: false,
          message: "Unauthorized"
        });
      }

      const key = randomKey();

      const expire = new Date(
        Date.now() + (days * 86400000)
      );

      const data = {
        status: "active",
        created: new Date().toISOString(),
        expire: expire.toISOString()
      };

      await env.LICENSES.put(
        key,
        JSON.stringify(data)
      );

      return Response.json({
        success: true,
        key,
        status: data.status,
        expire: data.expire
      });
    }

    // ==========================
    // DISABLE LICENSE
    // ==========================
    if (url.pathname === "/disable") {

      const user = url.searchParams.get("user");
      const admin = url.searchParams.get("admin");
      const key = url.searchParams.get("key");

      if (user !== ADMIN_USER || admin !== ADMIN_KEY) {
        return Response.json({
          success: false,
          message: "Unauthorized"
        });
      }

      const raw = await env.LICENSES.get(key);

      if (!raw) {
        return Response.json({
          success: false,
          message: "License not found"
        });
      }

      const license = JSON.parse(raw);

      license.status = "inactive";

      await env.LICENSES.put(
        key,
        JSON.stringify(license)
      );

      return Response.json({
        success: true,
        key,
        status: "inactive"
      });
    }

    // ==========================
    // INFO LICENSE
    // ==========================
    if (url.pathname === "/info") {

      const user = url.searchParams.get("user");
      const admin = url.searchParams.get("admin");
      const key = url.searchParams.get("key");

      if (user !== ADMIN_USER || admin !== ADMIN_KEY) {
        return Response.json({
          success: false,
          message: "Unauthorized"
        });
      }

      const raw = await env.LICENSES.get(key);

      if (!raw) {
        return Response.json({
          success: false,
          message: "License not found"
        });
      }

      const license = JSON.parse(raw);

      return Response.json({
        success: true,
        key,
        ...license
      });
    }
    
    // ==========================
    // USER STATUS
    // ==========================
    if (url.pathname === "/user") {

      const chatId =
        url.searchParams.get("chat_id");

      if (!chatId) {
        return Response.json({
          active: false
        });
      }

      const raw =
        await env.USERS.get(chatId);

      if (!raw) {
        return Response.json({
          active: false
        });
      }

      const user =
        JSON.parse(raw);

      const now = Date.now();

      const expire =
        new Date(user.expire).getTime();

      if (expire <= now) {
        return Response.json({
          active: false
        });
      }

      return Response.json({
        active: true,
        key: user.key,
        expire: user.expire
      });
    }

    // ==========================
    // CREATE SESSION
    // ==========================
    if (url.pathname === "/session") {

      const key =
        url.searchParams.get("key");

      if (!key) {
        return Response.json({
          success: false,
          message: "Key required"
        });
      }

      const raw =
        await env.LICENSES.get(key);

      if (!raw) {
        return Response.json({
          success: false,
          message: "License not found"
        });
      }

      const token =
        crypto.randomUUID();

      await env.TOKENS.put(
        token,
        JSON.stringify({
          key,
          created: Date.now()
        }),
        {
          expirationTtl: 300
        }
      );

      return Response.json({
        success: true,
        token
      });
    }

    // ==========================
    // CONFIG
    // ==========================
    if (url.pathname === "/config") {

      const token =
        url.searchParams.get("token");

      if (!token) {
        return Response.json({
          success: false,
          message: "Token required"
        });
      }

      const raw =
        await env.TOKENS.get(token);

      if (!raw) {
        return Response.json({
          success: false,
          message: "Invalid session"
        });
      }

      return Response.json({
        success: true,
        version: "1.0.0",

        api_id: 27025220,
        api_hash: "xxxxxxxxxxxx",

        bot_username: "neolazerd",

        update_url: "https://domainmu.com/update",

        message: "Authorized"
      });
    }
    // ==========================
    // VERIFY PAGE
    // ==========================
    if (url.pathname === "/verify") {

        const token = url.searchParams.get("token");

        if (!token) {
            return new Response("Token required");
        }

        const raw = await env.TOKENS.get(token);

        if (!raw) {
            return new Response("Invalid token");
        }

        const html = `

    <!DOCTYPE html>
    <html>

    <head>
    <meta charset="UTF-8">
    <title>NeoCloud Verification</title>
    </head>

    <body>

    <h2>NeoCloud Verification</h2>

    <p>Harap tunggu...</p>

    <h1 id="cd">5</h1>

    <script>

    let i = 5;

    const x = setInterval(()=>{

        i--;

        document.getElementById("cd").innerText=i;

        if(i<=0){

            clearInterval(x);

         // window.open(
         //     'https://zerads.com/O833Q7f',
         //     '_blank'
         // );

            setTimeout(()=>{

                location.href =
                '/success?token=${token}';

            },10000);

        }

    },1000);

    </script>

    </body>
    </html>

    `;

          return new Response(html,{
              headers:{
                  "content-type":"text/html"
              }
          });

    }   
    
    // ==========================
    // VERSION
    // ==========================
    if (url.pathname === "/version") {
      return Response.json({
        success: true,
        version: "1.0.0",
        force_update: false,
        expected_hash: "c2576e2e9fde54bb1eb2d0ca91939bc2e0b0242e8c95d62d488bcd9baad71b3a"
      });
    }

    // ==========================
    // CHECK LICENSE
    // ==========================
    const key = url.searchParams.get("key");

    if (!key) {
      return Response.json({
        valid: false,
        message: "License key required"
      });
    }

    const raw = await env.LICENSES.get(key);

    if (!raw) {
      return Response.json({
        valid: false,
        message: "License not found"
      });
    }

    const license = JSON.parse(raw);

    if (license.status !== "active") {
      return Response.json({
        valid: false,
        message: "License inactive"
      });
    }

    const now = Date.now();
    const expire = new Date(
      license.expire
    ).getTime();

    if (expire <= now) {
      return Response.json({
        valid: false,
        message: "License expired"
      });
    }

    const remainingSeconds =
      Math.floor((expire - now) / 1000);

    const days = Math.floor(
      remainingSeconds / 86400
    );

    const hours = Math.floor(
      (remainingSeconds % 86400) / 3600
    );

    const minutes = Math.floor(
      (remainingSeconds % 3600) / 60
    );

    const seconds =
      remainingSeconds % 60;

    return Response.json({
      valid: true,
      key,
      status: license.status,
      created: license.created,
      expire: license.expire,
      remaining: {
        days,
        hours,
        minutes,
        seconds
      }
    });
  }
};

