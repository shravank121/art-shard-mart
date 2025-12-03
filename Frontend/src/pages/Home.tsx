import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Sparkles, Users, Shield, TrendingUp, ArrowRight, Palette, Coins, Zap, Award, Globe, CheckCircle } from "lucide-react";
import { ethers } from "ethers";
import {
  SEPOLIA_NFT_ADDRESS,
  SEPOLIA_FRACTIONALIZE_ADDRESS,
  SEPOLIA_FRACTION_MARKETPLACE_ADDRESS,
  NFT_ABI,
  FRACTIONALIZE_ABI,
  FRACTION_MARKETPLACE_ABI,
} from "@/config/contracts";

// Animated counter hook
const useCountUp = (end: number, duration: number = 2000, startOnView: boolean = true) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
    }
  }, [startOnView]);

  useEffect(() => {
    if (startOnView && ref.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasStarted) {
            setHasStarted(true);
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(ref.current);
      return () => observer.disconnect();
    }
  }, [hasStarted, startOnView]);

  useEffect(() => {
    if (!hasStarted || end === 0) return;

    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(startValue + (end - startValue) * easeOut);
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, hasStarted]);

  return { count, ref };
};

// Format number with commas
const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

const Home = () => {
  const [stats, setStats] = useState({
    totalNFTs: 0,
    totalVaults: 0,
    totalListings: 0,
    connectedWallets: 1, // At least the current user
  });
  const [loading, setLoading] = useState(true);

  // Load dynamic stats from blockchain and backend
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Fetch user count from backend API
        let userCount = 1;
        try {
          const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
          const response = await fetch(`${apiUrl}/api/auth/stats`);
          if (response.ok) {
            const data = await response.json();
            userCount = data.userCount || 1;
          }
        } catch {
          console.log("Backend not available, using default user count");
        }

        // Fetch blockchain stats
        let provider: ethers.Provider;
        if (typeof window !== "undefined" && (window as any).ethereum) {
          provider = new ethers.BrowserProvider((window as any).ethereum);
        } else {
          provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/bef97c7d99a241579f118d6b1bb576bd");
        }

        const nft = new ethers.Contract(SEPOLIA_NFT_ADDRESS, NFT_ABI, provider);
        
        let totalNFTs = 0;
        try {
          const supply = await nft.totalSupply();
          totalNFTs = Number(supply);
        } catch {}

        let totalVaults = 0;
        if (SEPOLIA_FRACTIONALIZE_ADDRESS) {
          try {
            const frac = new ethers.Contract(SEPOLIA_FRACTIONALIZE_ADDRESS, FRACTIONALIZE_ABI, provider);
            const vaultCount = await frac.vaultCount();
            totalVaults = Number(vaultCount);
          } catch {}
        }

        let totalListings = 0;
        if (SEPOLIA_FRACTION_MARKETPLACE_ADDRESS) {
          try {
            const fracMarket = new ethers.Contract(SEPOLIA_FRACTION_MARKETPLACE_ADDRESS, FRACTION_MARKETPLACE_ABI, provider);
            const listingCount = await fracMarket.listingCount();
            totalListings = Number(listingCount);
          } catch {}
        }

        setStats({
          totalNFTs,
          totalVaults,
          totalListings,
          connectedWallets: userCount,
        });
      } catch (e) {
        console.error("Failed to load stats:", e);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Animated counters
  const nftCounter = useCountUp(stats.totalNFTs, 2000);
  const vaultCounter = useCountUp(stats.totalVaults, 2000);
  const listingCounter = useCountUp(stats.totalListings, 2000);
  const userCounter = useCountUp(stats.connectedWallets, 2000);

  const displayStats = [
    { label: "Total NFTs Minted", value: formatNumber(nftCounter.count), icon: Palette, ref: nftCounter.ref },
    { label: "Active Vaults", value: formatNumber(vaultCounter.count), icon: Coins, ref: vaultCounter.ref },
    { label: "Share Listings", value: formatNumber(listingCounter.count), icon: TrendingUp, ref: listingCounter.ref },
    { label: "Users", value: formatNumber(userCounter.count), icon: Users, ref: userCounter.ref },
  ];

  const features = [
    {
      icon: Sparkles,
      title: "Mint & Create",
      description: "Transform your digital art into NFTs with our easy-to-use minting platform."
    },
    {
      icon: Coins,
      title: "Fractionalize",
      description: "Break down expensive NFTs into affordable shares, making art accessible to everyone."
    },
    {
      icon: Shield,
      title: "Secure Trading",
      description: "Trade with confidence using our secure, smart contract-powered marketplace."
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Join a thriving community of artists, collectors, and fractional owners."
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Execute trades and mint NFTs in seconds with our optimized smart contracts."
    },
    {
      icon: Award,
      title: "Premium Quality",
      description: "Curated collection of high-quality digital art from verified artists worldwide."
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "Trade 24/7 with collectors and artists from around the world seamlessly."
    }
  ];

  const testimonials = [
    {
      quote: "NFTFract revolutionized how I invest in digital art. Fractional ownership makes it so accessible!",
      author: "Sarah Chen",
      role: "Digital Art Collector"
    },
    {
      quote: "As an artist, this platform helped me reach a wider audience and sell my work more effectively.",
      author: "Marcus Rivera",
      role: "NFT Artist"
    },
    {
      quote: "The security and ease of use convinced me to start my NFT journey here. Highly recommended!",
      author: "David Park",
      role: "Crypto Investor"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-20" />
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl float-animation" />
        <div className="absolute bottom-32 right-16 w-32 h-32 bg-secondary/10 rounded-full blur-xl float-animation stagger-delay-2" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 gradient-primary text-white fade-in-up pulse-glow">
              🚀 The Future of NFT Ownership
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight fade-in-up stagger-delay-1">
              Own a Piece of{" "}
              <span className="gradient-primary bg-clip-text text-transparent">
                Digital Art
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto fade-in-up stagger-delay-2">
              Discover, collect, and fractionalize NFTs. Make expensive digital art accessible 
              through fractional ownership and smart trading.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in-up stagger-delay-3">
              <Button size="lg" className="btn-neon text-lg px-8" asChild>
                <Link to="/marketplace">
                  Explore Marketplace
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 border-card-border" asChild>
                <Link to="/mint">Create NFT</Link>
              </Button>
            
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-card-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {displayStats.map((stat, index) => (
              <div 
                key={index} 
                ref={stat.ref}
                className="text-center fade-in-up" 
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center pulse-glow">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  {loading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 fade-in-up">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Why Choose{" "}
              <span className="gradient-primary bg-clip-text text-transparent">
                NFTFract
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the next generation of NFT trading with fractional ownership, 
              secure transactions, and a vibrant community.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card border-card-border hover:border-primary/50 transition-all duration-300 group hover:scale-105 hover:shadow-lg fade-in-up" style={{animationDelay: `${index * 0.1}s`}}>
                <CardHeader className="text-center">
                  <div className="w-12 h-12 rounded-lg gradient-primary mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 fade-in-up">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Built for the{" "}
              <span className="gradient-primary bg-clip-text text-transparent">
                Modern Collector
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced features designed to enhance your NFT trading experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center fade-in-up" style={{animationDelay: `${index * 0.2}s`}}>
                <div className="w-16 h-16 rounded-full gradient-primary mx-auto mb-6 flex items-center justify-center float-animation">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 fade-in-up">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              What Our{" "}
              <span className="gradient-primary bg-clip-text text-transparent">
                Community Says
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of satisfied artists, collectors, and investors.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-card border-card-border fade-in-up" style={{animationDelay: `${index * 0.2}s`}}>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <div className="flex mb-2">
                      {[...Array(5)].map((_, i) => (
                        <CheckCircle key={i} className="w-4 h-4 text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-secondary relative overflow-hidden">
        <div className="absolute top-10 left-1/4 w-24 h-24 bg-primary/10 rounded-full blur-xl float-animation" />
        <div className="absolute bottom-16 right-1/3 w-16 h-16 bg-secondary/10 rounded-full blur-xl float-animation stagger-delay-3" />
        <div className="container mx-auto px-4 text-center relative">
          <div className="fade-in-up">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-foreground">
              Ready to Start Your NFT Journey?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of artists and collectors who are already trading, 
              creating, and fractionalizing NFTs on our platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-neon text-lg px-8" asChild>
                <Link to="/mint">
                  Start Creating
                  <Sparkles className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 border-card-border" asChild>
                <Link to="/marketplace">Browse Collections</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;