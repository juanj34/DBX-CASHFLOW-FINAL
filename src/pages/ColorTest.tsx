import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const ColorTest = () => {
  useDocumentTitle("Color Test");

  const tailwindColors = [
    { name: "emerald", shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] },
    { name: "amber", shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] },
    { name: "cyan", shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] },
    { name: "rose", shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] },
    { name: "blue", shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] },
  ];

  const semanticColors = [
    { name: "primary", class: "bg-primary text-primary-foreground" },
    { name: "secondary", class: "bg-secondary text-secondary-foreground" },
    { name: "muted", class: "bg-muted text-muted-foreground" },
    { name: "accent", class: "bg-accent text-accent-foreground" },
    { name: "destructive", class: "bg-destructive text-destructive-foreground" },
    { name: "status-success", class: "bg-status-success text-white" },
    { name: "status-warning", class: "bg-status-warning text-black" },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">Color Test Page</h1>
      
      {/* Semantic Colors */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Semantic Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {semanticColors.map((color) => (
            <div key={color.name} className={`p-4 rounded-lg ${color.class}`}>
              <p className="font-medium">{color.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tailwind Default Colors */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Tailwind Default Colors</h2>
        {tailwindColors.map((color) => (
          <div key={color.name} className="mb-6">
            <h3 className="text-lg font-medium text-foreground mb-2 capitalize">{color.name}</h3>
            <div className="flex flex-wrap gap-2">
              {color.shades.map((shade) => (
                <div key={shade} className="text-center">
                  <div 
                    className={`w-16 h-16 rounded-lg bg-${color.name}-${shade} border border-border`}
                  />
                  <span className="text-xs text-muted-foreground">{shade}</span>
                </div>
              ))}
            </div>
            {/* Text colors */}
            <div className="flex flex-wrap gap-4 mt-2">
              {[300, 400, 500, 600].map((shade) => (
                <span key={shade} className={`text-${color.name}-${shade} font-medium`}>
                  text-{color.name}-{shade}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Common UI Patterns */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Common UI Patterns</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <span className="text-emerald-400">+12.5% Positive</span>
            <span className="text-rose-400">-8.3% Negative</span>
            <span className="text-amber-400">⚠ Warning</span>
            <span className="text-cyan-400">ℹ Info</span>
          </div>
          <div className="flex gap-4">
            <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">Success Badge</span>
            <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full">Warning Badge</span>
            <span className="bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full">Error Badge</span>
          </div>
        </div>
      </section>

      {/* Price Display Test */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Price Display Test</h2>
        <div className="space-y-2">
          <p className="text-2xl font-bold text-emerald-400">AED 1,619,000</p>
          <p className="text-lg text-amber-300">Starting from AED 850,000</p>
          <p className="text-sm text-emerald-500">+15% appreciation</p>
        </div>
      </section>
    </div>
  );
};

export default ColorTest;
