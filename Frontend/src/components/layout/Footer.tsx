import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-card-border bg-card/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-lg font-bold gradient-primary bg-clip-text text-transparent">
                NFTFract
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              The future of NFT ownership through fractionalization.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Navigation</h3>
            <div className="space-y-2">
              <Link to="/" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Home
              </Link>
              <Link to="/marketplace" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Marketplace
              </Link>
              <Link to="/mint" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Mint NFT
              </Link>
              <Link to="/dashboard" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Dashboard
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Support</h3>
            <div className="space-y-2">
              <Link to="/about" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                About
              </Link>
              <Link to="/contact" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Contact
              </Link>
              <Link to="/help" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Help Center
              </Link>
              <Link to="/terms" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Terms of Service
              </Link>
            </div>
          </div>

          {/* Community */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Community</h3>
            <div className="space-y-2">
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Discord
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Twitter
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Medium
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-card-border text-center text-muted-foreground text-sm">
          <p>&copy; 2024 NFTFract. All rights reserved. Built on Ethereum.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;