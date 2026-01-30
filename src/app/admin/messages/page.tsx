import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { MessagesList } from "@/components/admin/messages-list";
import { InfoBar } from "@/components/admin/info-bar";
import { MessageSquare, Search, Eye, Filter } from "lucide-react";

async function getMessages(search?: string, sortBy?: string, showUnread?: boolean) {
    const where: { isRead?: boolean; OR?: any[] } = {};

    if (showUnread) {
        where.isRead = false;
    }

    if (search) {
        where.OR = [
            { name: { contains: search } },
            { email: { contains: search } },
            { message: { contains: search } },
            { country: { contains: search } },
            { city: { contains: search } },
        ];
    }

    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "name") orderBy = { name: "asc" };
    if (sortBy === "oldest") orderBy = { createdAt: "asc" };
    if (sortBy === "country") orderBy = { country: "asc" };

    return prisma.message.findMany({ where, orderBy });
}

async function getStats() {
    const [total, unread] = await Promise.all([
        prisma.message.count(),
        prisma.message.count({ where: { isRead: false } }),
    ]);
    return { total, unread };
}

async function getArtist() {
    return prisma.artist.findFirst();
}

async function getSignature() {
    const sig = await prisma.emailSignature.findFirst({ orderBy: { updatedAt: "desc" } });
    if (!sig) return null;

    let html = "";
    if (sig.logoUrl) {
        html += `<img src="${sig.logoUrl}" alt="Logo" style="max-width: 150px; max-height: 60px; object-fit: contain; margin-bottom: 10px;" />`;
    }
    html += sig.content;
    return html;
}

// Server actions
async function toggleMessageRead(formData: FormData) {
    "use server";
    const id = parseInt(formData.get("id") as string);
    const isRead = formData.get("isRead") === "true";
    await prisma.message.update({ where: { id }, data: { isRead: !isRead } });
    revalidatePath("/admin/messages");
}

async function deleteMessage(formData: FormData) {
    "use server";
    const id = parseInt(formData.get("id") as string);
    await prisma.message.delete({ where: { id } });
    revalidatePath("/admin/messages");
}

async function markAllRead() {
    "use server";
    await prisma.message.updateMany({ where: { isRead: false }, data: { isRead: true } });
    revalidatePath("/admin/messages");
}

export default async function MessagesPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; sort?: string; unread?: string }>;
}) {
    const params = await searchParams;
    const showUnread = params.unread === "true";
    const [messages, stats, artist, signature] = await Promise.all([
        getMessages(params.search, params.sort, showUnread),
        getStats(),
        getArtist(),
        getSignature(),
    ]);

    return (
        <div className="min-h-screen">
            {/* InfoBar */}
            <InfoBar counter={`${stats.unread} unread`} />

            <div className="max-w-7xl mx-auto px-4 pb-10">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="font-display text-display-sm sm:text-display-md tracking-wider uppercase flex items-center gap-3">
                            <MessageSquare className="text-accent-coral" size={28} />
                            Messages
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {stats.total} total • {stats.unread} unread
                        </p>
                    </div>
                    {stats.unread > 0 && (
                        <form action={markAllRead}>
                            <button type="submit" className="btn-secondary flex items-center gap-2 text-xs px-3 py-2 sm:text-sm sm:px-4">
                                <Eye size={14} />
                                Mark All Read
                            </button>
                        </form>
                    )}
                </div>

                {/* Search and Filters */}
                <div className="glass-card p-3 sm:p-4 mb-6">
                    <form className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="flex-1 relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                name="search"
                                defaultValue={params.search}
                                placeholder="Search messages..."
                                className="input-field pl-10 w-full text-sm"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <select name="sort" defaultValue={params.sort || "newest"} className="input-field pr-8 text-sm flex-1 sm:flex-none">
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                                <option value="name">By Name</option>
                                <option value="country">By Country</option>
                            </select>
                            <label className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    name="unread"
                                    value="true"
                                    defaultChecked={showUnread}
                                    className="w-4 h-4 accent-accent-coral"
                                />
                                Unread
                            </label>
                            <button type="submit" className="btn-primary flex items-center gap-2 text-xs sm:text-sm px-3 py-2">
                                <Filter size={14} />
                                Apply
                            </button>
                        </div>
                    </form>
                </div>

                {/* Messages List */}
                {messages.length > 0 ? (
                    <MessagesList
                        messages={messages}
                        signature={signature}
                        toggleReadAction={toggleMessageRead}
                        deleteAction={deleteMessage}
                    />
                ) : (
                    <div className="glass-card py-20 text-center text-muted-foreground">
                        <MessageSquare className="mx-auto mb-4" size={48} />
                        <p className="text-lg">No messages found</p>
                        <p className="text-sm mt-1">
                            {params.search || showUnread
                                ? "Try adjusting your search or filters"
                                : "Messages from your contact form will appear here"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
