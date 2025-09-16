import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Share2, Eye } from "lucide-react";
import { useState } from "react";

interface NFTCardProps {
  id: string;
  title: string;
  artist: string;
  image: string;
  price: string;
  currency: string;
  isLiked?: boolean;
  isFractional?: boolean;
  totalShares?: number;
  availableShares?: number;
  pricePerShare?: string;
  onLike?: () => void;
  onShare?: () => void;
  onView?: () => void;
  onPurchase?: () => void;
}

const NFTCard = ({
  id,
  title,
  artist,
  image,
  price,
  currency = "ETH",
  isLiked = false,
  isFractional = false,
  totalShares,
  availableShares,
  pricePerShare,
  onLike,
  onShare,
  onView,
  onPurchase,
}: NFTCardProps) => {
  const [liked, setLiked] = useState(isLiked);

  const handleLike = () => {
    setLiked(!liked);
    onLike?.();
  };

  return (
    <Card className="nft-card group bg-card border-card-border overflow-hidden">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute top-4 right-4 flex space-x-2">
            <Button
              size="sm"
              variant="ghost"
              className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/40"
              onClick={handleLike}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/40"
              onClick={onShare}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="absolute bottom-4 left-4 right-4">
            <Button
              onClick={onView}
              className="w-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </div>
        </div>

        {/* Fractional Badge */}
        {isFractional && (
          <Badge className="absolute top-4 left-4 gradient-primary text-white">
            Fractional
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground truncate">{title}</h3>
          <p className="text-sm text-muted-foreground">by {artist}</p>
          
          {isFractional && totalShares && availableShares ? (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Available Shares:</span>
                <span className="text-foreground">{availableShares}/{totalShares}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Per Share:</span>
                <span className="font-medium text-primary">{pricePerShare} {currency}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="font-semibold text-primary">{price} {currency}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={onPurchase}
          className="w-full btn-neon"
        >
          {isFractional ? "Buy Shares" : "Buy Now"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NFTCard;