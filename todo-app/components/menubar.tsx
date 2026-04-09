import { SidebarTrigger } from "./ui/sidebar";


export default function AppMenubar() {
    return (
        <div className="w-full border-b">
            <div className="container mx-auto flex py-4 items-center gap-4 px-8 ">
                {/* <SidebarTrigger className="h-6 w-6 text-foreground" /> */}
                <div className="h-6">
                    <span className="text-sm font-medium">
                        Welcome, Benjamin!
                    </span>
                </div>
            </div>
        </div>
    )
}