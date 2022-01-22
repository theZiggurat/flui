import { CreatePageProjectQueryWithId } from "@database/args"
import { withCreatePageProject } from "@database/selectors"
import { projectLastSave, projectLastSaveLocal } from "@recoil/project"
import { nanoid } from "nanoid"
import { useSession } from "next-auth/client"
import router from "next/router"
import { useRecoilState, useSetRecoilState } from "recoil"

type ForkOptions = {
  title?: string,
}
const useFork = () => {

  const setProjectLastSave = useSetRecoilState(projectLastSave)
  const setProjectLastSaveLocal = useSetRecoilState(projectLastSaveLocal)

  const [currentProject, setCurrentProject] = useRecoilState(withCreatePageProject)
  const [session, loading] = useSession()

  const fork = (inputProject?: CreatePageProjectQueryWithId, forkOptions?: ForkOptions) => {

    const localProjectId = nanoid(8)
    const updateDateLocal = new Date().toISOString()
    const project = inputProject ?? currentProject
    const projectWithDate = {
      ...project,
      forkedFrom: {
        id: project.id,
        title: project.title
      },
      title: forkOptions?.title ?? `${project.title} (fork)`,
      author: {
        id: session?.user?.id!,
        name: session?.user?.name ?? null,
        image: session?.user?.image ?? null
      } ?? null,
      id: localProjectId,
      shaders: project.shaders.map(s => ({
        ...s,
        id: '',
        projectId: localProjectId,
      })),
      updatedAt: updateDateLocal,
      published: false
    }

    setProjectLastSave(null)
    setProjectLastSaveLocal(updateDateLocal)
    localStorage.setItem(`project_local_${localProjectId}`, JSON.stringify(projectWithDate))
    router.push(`/create/${localProjectId}`)
  }

  return fork

}

export default useFork