import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Profile = () => {
  const raw = typeof window !== 'undefined' ? localStorage.getItem("user") : null;
  const user = raw ? JSON.parse(raw) as { _id: string; username: string; email: string; token: string } : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl animate-fadeInUp">
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
      </div>
    </div>
  );
};

export default Profile;
