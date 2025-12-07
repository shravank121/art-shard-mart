import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { apiGetConnectedWallets } from "@/lib/api";
import { Wallet, RefreshCw } from "lucide-react";

interface WalletInfo {
  address: string;
  connectedAt: string;
  lastUsed: string;
}

const Profile = () => {
  const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = raw
    ? (JSON.parse(raw) as { _id: string; username: string; email: string; token: string })
    : null;

  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(true);

  const fetchWallets = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoadingWallets(false);
      return;
    }
    setLoadingWallets(true);
    try {
      const data = await apiGetConnectedWallets();
      setWallets(data.wallets || []);
    } catch (error) {
      console.error("Failed to fetch wallets:", error);
      setWallets([]);
    } finally {
      setLoadingWallets(false);
    }
  }, []);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl animate-fadeInUp space-y-6">
        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!user ? (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">You are not logged in.</p>
                <div className="flex gap-2 justify-center">
                  <Button asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button variant="outline" className="border-card-border" asChild>
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Username</span>
                  <span className="font-medium">{user.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono text-sm">{user._id}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {user && (
          <Card className="bg-card border-card-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Connected Wallets
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchWallets}
                  disabled={loadingWallets}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingWallets ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <CardDescription>
                Wallets you have connected to your account ({wallets.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingWallets ? (
                <p className="text-muted-foreground text-center py-4">Loading wallets...</p>
              ) : wallets.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No wallets connected yet.</p>
              ) : (
                <div className="space-y-3">
                  {wallets.map((wallet, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-mono text-sm">{formatAddress(wallet.address)}</p>
                        <p className="text-xs text-muted-foreground">
                          Connected: {formatDate(wallet.connectedAt)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Last used: {formatDate(wallet.lastUsed)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;
