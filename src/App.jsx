
import './App.css'

function App() {

const jobs = [
    { id: 1, title: "React Developer", company: "Tech Flow", salary: "5000 - 7000 BGN", tags: ["React", "Tailwind"] },
    { id: 2, title: "Python Scraper Expert", company: "Data Inc", salary: "4500 BGN", tags: ["Python", "Playwright"] },
    { id: 3, title: "Junior Web Dev", company: "StartUp BG", salary: "3000 BGN", tags: ["JS", "daisyUI"] },
  ];
  return (
    <>
      <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-black text-primary tracking-tight">
            DEV.BG <span className="text-base-content font-light text-2xl">Scraper</span>
          </h1>
          <button className="btn btn-primary btn-sm md:btn-md shadow-lg">
            Обнови обявите
          </button>
        </div>

        {/* Jobs Grid/List */}
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="card card-side bg-base-100 shadow-xl border border-base-300 hover:border-primary transition-colors cursor-pointer">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="card-title text-xl mb-1">{job.title}</h2>
                    <p className="text-sm text-gray-500">{job.company}</p>
                  </div>
                  <div className="badge badge-outline badge-success font-bold p-3">
                    {job.salary}
                  </div>
                </div>

                <div className="card-actions justify-start mt-4">
                  {job.tags.map(tag => (
                    <div key={tag} className="badge badge-ghost text-xs uppercase font-semibold">
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
      
      
    </>
  )
}

export default App
