import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Sparkles, Users, Shield, TrendingUp, ArrowRight, Palette, Coins } from "lucide-react";

const Home = () => {
  const stats = [
    { label: "Total NFTs", value: "12,543", icon: Palette },
    { label: "Artists", value: "2,891", icon: Users },
    { label: "Volume Traded", value: "45,672 ETH", icon: TrendingUp },
    { label: "Fractional Shares", value: "156,789", icon: Coins },
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 gradient-primary text-white">
              The Future of NFT Ownership
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Own a Piece of{" "}
              <span className="gradient-primary bg-clip-text text-transparent">
                Digital Art
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover, collect, and fractionalize NFTs. Make expensive digital art accessible 
              through fractional ownership and smart trading.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  {stat.value}
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
          <div className="text-center mb-16">
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
              <Card key={index} className="bg-card border-card-border hover:border-primary/50 transition-colors group">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 rounded-lg gradient-primary mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
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

      {/* CTA Section */}
      <section className="py-20 gradient-secondary">
        <div className="container mx-auto px-4 text-center">
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
      </section>
    </div>
  );
};

export default Home;