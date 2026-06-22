import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { getUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { getProfile } from "@/actions/profile.actions";
import { getNotificationSettingsAction } from "@/actions/weekly-digest.actions";
import { NotificationSettingsForm } from "@/components/profile/NotificationSettingsForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function ProfilePage() {
  const [user, profile, settings] = await Promise.all([
    getUser(),
    getProfile(),
    getNotificationSettingsAction(),
  ]);

  if (!user) {
    redirect("/login");
  }

  const displayName = profile?.name || user.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your profile details and account information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">{displayName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <p className="text-muted-foreground">{profile?.name || "Not set"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Member since</label>
                <p className="text-muted-foreground">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div id="weekly-digest">
          <Card>
            <CardHeader>
              <CardTitle>Notification preferences</CardTitle>
              <CardDescription>
                Choose how Opportunity Hunter keeps you in the loop.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {settings ? (
                <NotificationSettingsForm
                  initial={{
                    email_enabled: settings.email_enabled,
                    weekly_digest_enabled: settings.weekly_digest_enabled,
                  }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sign in to manage your notification preferences.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
