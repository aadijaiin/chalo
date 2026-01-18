import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import NavigationOutlinedIcon from "@mui/icons-material/NavigationOutlined";

export default function Features() {
  return (
    <section className="px-6 lg:px-40 py-24 bg-white" id="how-it-works">
      <div className="max-w-300 mx-auto">
        <div className="flex flex-col gap-6 text-center mb-16">
          <h2 className="text-4xl font-extrabold tracking-tight text-earth">
            Simple &amp; Seamless
          </h2>
          <p className="text-earth/70 max-w-150 mx-auto text-lg">
            Coordinate your group in three simple steps. Designed for real-world
            movement.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center gap-6 p-10 rounded-3xl bg-cream border border-sage/10 hover:border-primary-foreground/30 transition-all group">
            <div className="w-16 h-16 rounded-2xl bg-sage/10 text-sage flex items-center justify-center group-hover:bg-sage group-hover:text-white transition-all">
              <AddCircleOutlineIcon />
            </div>
            <h3 className="text-xl font-bold text-earth">Create Group</h3>
            <p className="text-earth/60 text-center leading-relaxed">
              Instantly generate a secure, temporary session. No registration
              required.
            </p>
          </div>
          <div className="flex flex-col items-center gap-6 p-10 rounded-3xl bg-cream border border-sage/10 hover:border-primary-foreground/30 transition-all group">
            <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 text-primary-foreground flex items-center justify-center group-hover:bg-primary-foreground group-hover:text-white transition-all">
              <ShareOutlinedIcon />
            </div>
            <h3 className="text-xl font-bold text-earth">Share Link</h3>
            <p className="text-earth/60 text-center leading-relaxed">
              Send a private invite via text or WhatsApp. Friends join with one
              click.
            </p>
          </div>
          <div className="flex flex-col items-center gap-6 p-10 rounded-3xl bg-cream border border-sage/10 hover:border-primary-foreground/30 transition-all group">
            <div className="w-16 h-16 rounded-2xl bg-sage/10 text-sage flex items-center justify-center group-hover:bg-sage group-hover:text-white transition-all">
              <NavigationOutlinedIcon />
            </div>
            <h3 className="text-xl font-bold text-earth">Track Live</h3>
            <p className="text-earth/60 text-center leading-relaxed">
              See everyone move in real-time on a beautiful, shared map with
              live ETAs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
