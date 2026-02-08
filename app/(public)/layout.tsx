import Header from "@/components/header";
import PublicFooter from "@/components/PublicFooter";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Header></Header>
            <main>{children}</main>
            <PublicFooter></PublicFooter>
        </>
    );
}
