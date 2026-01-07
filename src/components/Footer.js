import { FaFacebook, FaTwitter, FaInstagram, FaTiktok } from 'react-icons/fa';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-[#0B0B12] text-white px-6 py-10">
      <div className="max-w-7xl mx-auto flex flex-wrap gap-x-4 gap-y-8 justify-center md:justify-between items-start">

        {/* Logo + Title */}
        <div className="flex flex-col items-center md:items-start space-y-1 min-w-[140px] text-center md:text-left">
          <div className="flex items-center space-x-2">
            <Image src="/images/PFRlogo.jpg" alt="Logo" width={48} height={48} />
            <div className="text-white font-['montage'] uppercase text-4xl leading-tight">
              PRO FOOTBALL REPORT
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-white h-20 self-start"></div>

        {/* Follow Us */}
        <div className="flex flex-col items-center md:items-start min-w-[140px] text-center md:text-left">
          <h3 className="text-lg font-bold mb-2">Follow Us</h3>
          <div className="flex space-x-3 mb-3 justify-center md:justify-start">
            <a href="https://www.facebook.com/share/1FsaZd1tu2/?mibextid=wwXIfr" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center">
              <FaFacebook />
            </a>
            <a href="https://www.instagram.com/profootball.report?igsh=eHdsd25ybzN4NTdt&utm_source=qr" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center">
              <FaInstagram />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center">
              <FaTwitter />
            </a>
            <a href="https://www.tiktok.com/@profootballnews2?_r=1&_t=ZS-92IjrUV6rlH" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center">
              <FaTiktok />
            </a>
          </div>
          <button className="bg-white text-black rounded-full px-4 py-1 transition-colors duration-150 active:bg-black active:text-white">
            Contact Us
          </button>
        </div>

        {/* Subscribe */}
        <div className="flex flex-col items-center md:items-start w-[260px] max-w-full text-center md:text-left">
          <h3 className="text-lg font-bold mb-2">Subscribe</h3>
          <div className="flex flex-col gap-2 w-full">
            <input
              type="text"
              placeholder="First Name"
              className="w-full bg-white text-black placeholder-gray-500 p-2 text-sm rounded focus:outline-none focus:ring-0"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full bg-white text-black placeholder-gray-500 p-2 text-sm rounded focus:outline-none focus:ring-0"
            />
            <button className="bg-black border border-white text-white px-4 py-2 rounded-md w-full text-base font-sans transition-colors duration-150 active:bg-white active:text-black">
              Subscribe
            </button>
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col items-center md:items-start w-[260px] max-w-full text-center md:text-left">
          <h3 className="text-lg font-bold mb-2">Email</h3>

          <a href="mailto:profootball@gmail.com" className="bg-black border border-white text-white px-4 py-2 rounded-md w-full text-base font-sans transition-colors duration-150 active:bg-white active:text-black text-center inline-block">
            Email Us
          </a>
        </div>

        {/* About */}
        <div className="flex flex-col items-center md:items-start min-w-[140px] text-center md:text-left">
          <h3 className="text-lg font-bold mb-2">About</h3>
          <div className="flex flex-col space-y-1 text-sm">
            <a href="#" className="text-white hover:underline">Privacy Policy</a>
            <a href="#" className="text-white hover:underline">Terms of Use</a>
            <a href="#" className="text-white hover:underline">Advertise with Us</a>
            <a href="#" className="text-white hover:underline">Legal</a>
            <a href="#" className="text-white hover:underline">Site Map</a>
          </div>
        </div>
      </div>

      {/* Disclaimer and Bottom Line */}
      <div className="max-w-7xl mx-auto text-xs text-white pt-20 text-center">
        <p className="mb-4">
          DISCLAIMER: This site and the products offered are for entertainment purposes only, and there is no gambling offered on this site. This service is intended for adult audiences. No guarantees are made for any specific outcome. If you or someone you know has a gambling problem, please call 1-800-GAMBLER.
        </p>

        <div className="border-t border-white my-4"></div>

        <p>© 2025 Pro Football Report</p>
      </div>
    </footer>
  );
};

export default Footer;
