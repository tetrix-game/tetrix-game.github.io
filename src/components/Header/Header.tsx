import MenuDropdown from '../MenuDropdown';
import LocationButton from '../LocationButton';
import './Header.css';

const Header = () => {
  return (
    <div className="tetrix_header">
      <div className="tetrix_header_start">
        <MenuDropdown />
      </div>
      <div className="tetrix_header_middle">
        <h1>TETRIX</h1>
      </div>
      <div className="tetrix_header_end">
        <LocationButton />
      </div>
    </div >
  );
};

export default Header;