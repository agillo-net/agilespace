import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/about")({
  component: About,
});

function About() {
  return <div className="container mx-auto py-4">Hello from About!</div>;
}
