import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiGetAllNFTs } from "@/lib/api";
import { fetchIpfsJson, ipfsToHttp } from "@/lib/ipfs";

const NFTDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [nft, setNft] = useState<{ id: number | string; name?: string; owner: string; uri: string } | null>(null);
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const nfts = await apiGetAllNFTs();
        const found = nfts.find((n) => String(n.id) === String(id));
        setNft(found || null);
        if (found?.uri) {
          try {
            const m = await fetchIpfsJson(found.uri);
            setMeta(m);
          } catch {}
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-center space-y-4">
          <div className="text-2xl font-semibold">NFT not found</div>
          <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const image = meta?.image ? ipfsToHttp(meta.image) : (nft?.uri?.startsWith("http") ? nft.uri : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=800&fit=crop");

  const handleShare = async () => {
    const url = `${window.location.origin}/nft/${nft.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: nft.name, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {}
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl lg:text-4xl font-bold">NFT Details</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
            <Button onClick={handleShare}>Share</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-card border-card-border">
            <CardContent className="p-4">
              <img src={image} alt={nft.name} className="w-full h-auto rounded-lg" />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-foreground truncate">{meta?.name || nft?.name || `Token #${nft.id}`}</h2>
                <Badge>#{String(nft.id)}</Badge>
              </div>
              <div className="text-muted-foreground mt-1">
                Owner: {nft.owner ? `${nft.owner.slice(0,6)}...${nft.owner.slice(-4)}` : "Unknown"}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Metadata URI</div>
              <div className="break-all text-foreground">{nft.uri}</div>
            </div>

            {meta?.attributes && Array.isArray(meta.attributes) && meta.attributes.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Attributes</div>
                <ul className="list-disc pl-5 text-sm text-foreground">
                  {meta.attributes.map((a: any, i: number) => (
                    <li key={i}>{a.trait_type || a.trait || 'Attribute'}: {String(a.value)}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button className="btn-neon">Buy</Button>
              <Button variant="outline" className="border-card-border">Make Offer</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTDetails;
