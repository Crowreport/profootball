import CommentsPage from "@/components/CommentsPage";

export default async function Page({ params, searchParams }) {
  const awaitedParams = await params;
  const awaitedSearchParams = await searchParams;
  
  return (
    <CommentsPage 
      title={awaitedParams.title}
      sourceTitle={awaitedSearchParams.sourceTitle}
      sourceImage={awaitedSearchParams.sourceImage}
      sourceLink={awaitedSearchParams.sourceLink}
    />
  );
}
