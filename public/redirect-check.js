// Immediate redirect check for avatar parameter and login redirects
(function() {
    console.log("Redirect check script loaded");
    console.log("Current URL:", window.location.href);
    
    const urlParams = new URLSearchParams(window.location.search);
    const avatar = urlParams.get('avatar');
    
    // Handle avatar parameter from Discord login
    if (avatar) {
        console.log("Avatar found in URL, redirecting to /checking...");
        localStorage.setItem('avatar', avatar);
        
        // Clear parameters and redirect to checking page
        const cleanUrl = window.location.origin + '/checking';
        window.location.replace(cleanUrl);
        return;
    }
    
    // Handle direct access to localhost:5173 - redirect to checking if coming from Discord
    if (window.location.pathname === '/' && document.referrer.includes('discord.com')) {
        console.log("Redirecting from Discord OAuth to /checking");
        window.location.replace(window.location.origin + '/checking');
        return;
    }
})();
