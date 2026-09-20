import { TopBanner } from './components/TopBanner';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AboutSection } from './components/AboutSection';
import { ProjectsSection } from './components/ProjectsSection';
import { ProjectViewer } from './components/ProjectViewer';
import { Footer } from './components/Footer';
import { useProjects } from './hooks/useProjects';
import { useProjectRoute } from './hooks/useProjectRoute';

export default function App() {
  const { projects, status, error, reload } = useProjects();
  const route = useProjectRoute();

  const count = status === 'ready' ? projects.length : undefined;

  return (
    <div className="min-h-screen bg-[#f3f0ea] text-[#111111] flex flex-col selection:bg-black selection:text-white">
      <TopBanner count={count} />
      <Navbar />

      <main className="flex-1">
        <Hero count={count} />
        <AboutSection />
        <ProjectsSection
          projects={projects}
          status={status}
          error={error}
          onRetry={reload}
          onOpen={route.open}
        />
      </main>

      <Footer />

      {route.id && (
        <ProjectViewer
          key={route.id}
          projectId={route.id}
          listItem={projects.find((p) => p.id === route.id)}
          listStatus={status}
          docOpen={route.doc}
          onOpenDoc={() => route.openDoc(route.id!)}
          onCloseDoc={() => route.closeDoc(route.id!)}
          onClose={route.close}
        />
      )}
    </div>
  );
}
