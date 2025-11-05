import MenuDropdown from '../MenuDropdown';
import './Header.css';

const Header = () => {
  return (
    <div className="tetrix_header">
      <div className="tetrix_header_start">
        <MenuDropdown />
        <h2>Today</h2>
      </div>
      <div className="tetrix_header_middle">
        <h1>tetrix-game</h1>
      </div>
    </div >
  );
};

export default Header;