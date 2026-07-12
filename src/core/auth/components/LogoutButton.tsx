import { signOut } from "@/core/auth/auth";
import { Button } from "@/ui/components/Button";

/**
 * Ends the current session only. With the JWT session strategy this just
 * clears the signed cookie — it never touches Membership, Class, Achievement,
 * MarketplaceListing, or any other row. Nothing the user owns is affected.
 */
export function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <Button type="submit" variant="ghost" size="sm">
        Log out
      </Button>
    </form>
  );
}
