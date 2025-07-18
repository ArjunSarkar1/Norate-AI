function MainPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Welcome to Norate AI
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          A powerful AI tool for generating and managing notes. Experience seamless 
          dark and light mode switching across the entire application.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="p-6 rounded-lg border bg-card text-card-foreground">
          <h2 className="text-xl font-semibold mb-3">Feature 1</h2>
          <p className="text-muted-foreground">
            This card demonstrates how content adapts to theme changes with proper 
            background and text colors.
          </p>
        </div>
        
        <div className="p-6 rounded-lg border bg-card text-card-foreground">
          <h2 className="text-xl font-semibold mb-3">Feature 2</h2>
          <p className="text-muted-foreground">
            All text, backgrounds, and borders automatically adjust when you toggle 
            between light and dark modes.
          </p>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Try clicking the theme toggle button in the header to see the entire page transform!
        </p>
      </div>
    </div>
  )
}

export default MainPage