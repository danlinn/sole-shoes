import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPostById } from "@/lib/actions/post-actions";
import { EditListingForm } from "./edit-listing-form";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const post = await getPostById(id);
  if (!post) {
    notFound();
  }

  const isAdmin = Boolean(session.user.isAdmin);
  if (post.userId !== session.user.id && !isAdmin) {
    notFound();
  }

  const cancelHref = isAdmin ? "/admin/posts" : `/listings/${post.id}`;

  return (
    <EditListingForm
      cancelHref={cancelHref}
      post={{
        id: post.id,
        type: post.type,
        title: post.title,
        description: post.description,
        brand: post.brand,
        model: post.model,
        category: post.category,
        size: post.size,
        primaryColor: post.primaryColor,
        secondaryColor: post.secondaryColor,
        side: post.side,
        genderCategory: post.genderCategory,
        condition: post.condition,
        locationText: post.locationText,
        dateOccurred: post.dateOccurred,
        reward: post.reward,
        images: post.images,
      }}
    />
  );
}
