import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h2 className='text-2xl text-blue-500'>Hello World</h2>
      {' '}
      <span className="inline-flex items-center gap-3 ml-4 text-base">
        <button
          type="button"
          onClick={() => {setCount(c => c - 1)}}
          className="px-2 py-1 bg-gray-200 rounded"
          aria-label="decrement"
        >
          -
        </button>
        <span className="font-mono">{count}</span>
        <button
          type="button"
          onClick={() => {setCount(c => c + 1)}}
          className="px-2 py-1 bg-gray-200 rounded"
          aria-label="increment"
        >
          +
        </button>
      </span>

    </>
  )
}

export default App
