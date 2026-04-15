// 在浏览器控制台运行此脚本，或者通过 Electron 的 preload 脚本注入
// 这将设置应用跳过网关登录

localStorage.setItem('onboarding_done', 'true');
localStorage.setItem('theme', 'dark');

// 清除网关相关的认证信息
localStorage.removeItem('ANTHROPIC_API_KEY');
localStorage.removeItem('ANTHROPIC_BASE_URL');
localStorage.removeItem('gateway_user');
localStorage.removeItem('auth_token');

console.log('已设置完成，请刷新页面');
