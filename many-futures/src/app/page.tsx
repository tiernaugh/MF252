import { redirect } from "next/navigation";

export default function HomePage() {
	// Temporary redirect to projects page
	// TODO: Replace with proper landing page when authentication is added
	// Landing page will show marketing content for logged-out users
	// and redirect to /projects for authenticated users
	redirect("/projects");
}
