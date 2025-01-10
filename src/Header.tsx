import './App.css';
import './Header.css';

type HeaderProps = {
  score: number;
};

const Header = ({ score }: HeaderProps) => {
  return (
    <div className="tetrix_header">
      <div className="tetrix_header_start">
        <h2>Today</h2>
        <h3>{score}</h3>
      </div>
      <div className="tetrix_header_middle">
        <h1>tetrix-game</h1>
      </div>
    </div >
  );
};

export default Header;