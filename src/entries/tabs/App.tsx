const params = new URLSearchParams(location.search)
const videoUrl = params.get('videoUrl')

export default function App() {
  return (
    <div className="flex">
      <div>
        <video src={videoUrl || ''} className="bg-green-500" controls />
      </div>
      <div><div>Background</div></div>
    </div>
  )
}
