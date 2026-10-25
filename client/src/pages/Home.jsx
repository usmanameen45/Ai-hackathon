import { Link } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export default function Home() {
  const { data: session } = authClient.useSession();

  return (
    <section className="hero">
      <h1>MERN + Better Auth</h1>
      <p>Email &amp; password, Google and Facebook sign-in, backed by Express and MongoDB.</p>
      <Link to={session ? "/dashboard" : "/signup"} className="btn btn-primary">
        {session ? "Go to dashboard" : "Get started"}
      </Link>
    </section>
  );
}
