import { useState, useEffect } from 'react'
import './App.css'
import Search from './components/Search'
import Spinner from './components/Spinner';
import MovieCard from './components/Moviecard';
import {useDebounce} from 'react-use';
import { updateSearchCount, getTrendingMovies } from './appwrite';

const API_BASE_URL = "https://api.themoviedb.org/3/discover/movie";

const API_KEY = import.meta.env.VITE_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers:{
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const App = () => {

  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [movieList, setMovieList] = useState([]);
  const [isloading, setIsLoading] = useState(false);
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [trendingMovies, setTrendingMovies] = useState([]);

  useDebounce(() => setDebouncedTerm(searchTerm), 800, [searchTerm]);

  const fetchmovies = async (query = '') =>{

    setIsLoading(true);
    setErrorMessage('');

    try{
      const endpoint = query 
      ? `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}`
      : `${API_BASE_URL}?sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS);

      if(!response.ok){
        throw new Error("Failed to fetch movies.")
      }

      const data = await response.json();

      console.log(data);

      if(data.Response == 'False'){
        setErrorMessage(data.Error || 'Failed to fetch movies');
        setMovieList([]);
        return;
      }
      setMovieList(data.results || []);

      if(query && data.results.length > 0){
        await updateSearchCount(query, data.results[0]);
      }
    } catch(error) {
      console.error(`Error fetching movies: ${error}`);
    } finally{
      setIsLoading(false);
    }
  }

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();

      setTrendingMovies(movies);
    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`);
    }
  }

  useEffect(()=>{
    fetchmovies(debouncedTerm)
  }, [debouncedTerm])

  useEffect(()=>{
    loadTrendingMovies();
  },[]);
  
  return(
    <main>
      <div className='pattern'/>

      <div className='wrapper'>
        <header>
          <img src='./hero-img.png' alt='Hero Banner' />

          <h1>Find <span className='text-gradient'>movies</span> you'll enjoy without the Hassle</h1>

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        </header>

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className='all-movies'>
          <h2 className='mt-[40px]'>All-movies</h2>
          {isloading ? (
            <Spinner />
          ) : errorMessage ?(
            <p className='text-red-500'>{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>

      </div>
    </main>
  )
}

export default App;