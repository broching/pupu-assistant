import Header from "@/components/header";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Header></Header>
            <main>{children}</main>
            <footer className="relative w-full bg-[var(--color-theme-card-hex)] border-t border-theme-border-01">
                {/* subtle gray tint for both themes */}
                <div className="pointer-events-none absolute inset-0 bg-black/5 dark:bg-white/5" />

                {/* content wrapper */}
                <div className="relative">
                    {/* Top section */}
                    <div className="max-w-7xl mx-auto px-6 py-16">
                        <nav>
                            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:grid-cols-5">
                                {/* Product */}
                                <div>
                                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-theme-text-sec">
                                        Product
                                    </h3>
                                    <ul className="space-y-3">
                                        {[
                                            ["Agents", "/en-US/agent"],
                                            ["Enterprise", "/en-US/enterprise"],
                                            ["Code Review", "/en-US/bugbot"],
                                            ["Tab", "/en-US/tab"],
                                            ["CLI", "/en-US/cli"],
                                            ["Cloud Agents", "/agents"],
                                            ["Pricing", "/en-US/pricing"],
                                        ].map(([label, href]) => (
                                            <li key={label}>
                                                <a
                                                    href={href}
                                                    className="text-sm text-theme-text-sec hover:text-theme-text transition-colors"
                                                >
                                                    {label}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Resources */}
                                <div>
                                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-theme-text-sec">
                                        Resources
                                    </h3>
                                    <ul className="space-y-3">
                                        {[
                                            ["Download", "/en-US/download"],
                                            ["Changelog", "/en-US/changelog"],
                                            ["Docs", "/docs"],
                                        ].map(([label, href]) => (
                                            <li key={label}>
                                                <a
                                                    href={href}
                                                    className="text-sm text-theme-text-sec hover:text-theme-text transition-colors"
                                                >
                                                    {label}
                                                </a>
                                            </li>
                                        ))}
                                        <li>
                                            <a
                                                href="https://forum.cursor.com/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-theme-text-sec hover:text-theme-text transition-colors"
                                            >
                                                Forum ↗
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href="https://status.cursor.com/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-theme-text-sec hover:text-theme-text transition-colors"
                                            >
                                                Status ↗
                                            </a>
                                        </li>
                                    </ul>
                                </div>

                                {/* Company */}
                                <div>
                                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-theme-text-sec">
                                        Company
                                    </h3>
                                    <ul className="space-y-3">
                                        {[
                                            ["Careers", "/en-US/careers"],
                                            ["Blog", "/en-US/blog"],
                                            ["Community", "/en-US/community"],
                                            ["Students", "/en-US/students"],
                                            ["Brand", "/en-US/brand"],
                                        ].map(([label, href]) => (
                                            <li key={label}>
                                                <a
                                                    href={href}
                                                    className="text-sm text-theme-text-sec hover:text-theme-text transition-colors"
                                                >
                                                    {label}
                                                </a>
                                            </li>
                                        ))}
                                        <li>
                                            <a
                                                href="https://anysphere.inc/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-theme-text-sec hover:text-theme-text transition-colors"
                                            >
                                                Anysphere ↗
                                            </a>
                                        </li>
                                    </ul>
                                </div>

                                {/* Legal */}
                                <div>
                                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-theme-text-sec">
                                        Legal
                                    </h3>
                                    <ul className="space-y-3">
                                        {[
                                            ["Terms of Service", "/en-US/terms-of-service"],
                                            ["Privacy Policy", "/en-US/privacy"],
                                            ["Data Use", "/en-US/data-use"],
                                            ["Security", "/en-US/security"],
                                        ].map(([label, href]) => (
                                            <li key={label}>
                                                <a
                                                    href={href}
                                                    className="text-sm text-theme-text-sec hover:text-theme-text transition-colors"
                                                >
                                                    {label}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Connect */}
                                <div>
                                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-theme-text-sec">
                                        Connect
                                    </h3>
                                    <ul className="space-y-3">
                                        {[
                                            ["X", "https://x.com/cursor_ai"],
                                            ["LinkedIn", "https://www.linkedin.com/company/cursorai"],
                                            ["YouTube", "https://www.youtube.com/@cursor_ai"],
                                        ].map(([label, href]) => (
                                            <li key={label}>
                                                <a
                                                    href={href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-theme-text-sec hover:text-theme-text transition-colors"
                                                >
                                                    {label} ↗
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </nav>
                    </div>

                    {/* Bottom bar */}
                    <div className="border-t border-theme-border-01">
                        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-wrap items-center gap-4 text-sm text-theme-text-sec">
                                <span>
                                    © 2026{" "}
                                    <a
                                        href="https://anysphere.inc"
                                        className="hover:text-theme-text transition-colors"
                                    >
                                        Anysphere, Inc.
                                    </a>
                                </span>
                                <a
                                    href="/en-US/security"
                                    className="hover:text-theme-text transition-colors"
                                >
                                    🛡 SOC 2 Certified
                                </a>
                            </div>

                            {/* Controls (theme + language) */}
                            <div className="flex items-center gap-4">
                                {/* theme toggle */}
                                {/* language selector */}
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}
