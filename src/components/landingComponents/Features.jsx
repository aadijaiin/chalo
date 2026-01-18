import ShareIcon from '@mui/icons-material/Share';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import NavigationIcon from '@mui/icons-material/Navigation';

const data = [
    {
        "icon": <AddCircleOutlineIcon/>,
        "title": "Create Group",
        "description": "Instantly generate a secure, temporary session. No registration required."
    },
    {
        "icon": <ShareIcon/>,
        "title": "Share Link",
        "description": "Send a private invite via text or WhatsApp. Friends join with one click."
    },
    {
        "icon":<NavigationIcon/>,
        "title": "Track Live",
        "description": "See everyone move in real-time on a beautiful, shared map with live ETAs."
    }
]
export default function Features() {
    return (
        <>
            <div className="w-full bg-primary text-foreground py-20 px-4">
                <div className="mx-auto max-w-4xl flex flex-col items-center text-center">
                    <p className="font-black text-2xl sm:text-3xl md:text-4xl">
                        Simple & Seamless
                    </p>

                    <p className="mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground">
                        Coordinate your group in three simple steps. Designed for real-world movement.
                    </p>
                </div>

                <div className="mx-auto mt-12 max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-2">
                    {data.map((value, key) => (
                        <div
                            key={key}
                            className="rounded-3xl flex flex-col items-center gap-4 bg-card px-8 py-12 text-center shadow-sm"
                        >
                            <div className="rounded-xl p-4 bg-primary-foreground">
                                {value.icon}
                            </div>

                            <p className="font-medium pt-2 text-lg sm:text-xl">
                                {value.title}
                            </p>

                            <p className="text-sm sm:text-base text-muted-foreground">
                                {value.description}
                            </p>
                        </div>
                    ))}
                </div>

            </div>
        </>

    )
}