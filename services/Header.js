import React, { useState, useEffect } from "react";
import Link from "next/link";
import cls from "classnames";
import Icon from "../Icon";
import Navigation from "./Navigation";
import UserDropdown from "../userDropdown/UserDropdown";
import NotificationBar from "../NotificationBar";
import useGetUnreadNotif from "../../features/notification/hooks/useGetUnreadNotif";

const Header = ({ user }) => {
  const [openNav, setOpenNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { data: notifications } = useGetUnreadNotif();

  useEffect(() => {
    window.addEventListener("scroll", () => {
      const header = document.getElementById("header");
      const headerOffset = header.offsetTop;

      if (window.scrollY > headerOffset) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    });
  }, []);

  const handleHamburgerClick = (e) => {
    e.preventDefault();
    setOpenNav(true);
  };

  const handleClosed = () => {
    setOpenNav(false);
  };

  return (
    <section id="header" className={cls("w-full z-10", { fixed: scrolled })}>
      <Navigation open={openNav} onClosed={handleClosed} />
      <header
        className={cls("bg-admin", { hidden: openNav }, { block: !openNav })}
      >
        <div className="w-full flex justify-between items-center p-4">
          <div className="flex gap-10">
            <div className="font-ubuntu flex items-center gap-1">
              <Link href="/admin">
                <a className="w-[20px] h-[20px] rounded-md bg-white"></a>
              </Link>
              <Link href="/dashboard">
                <a className="text-white text-[14px]">arsi.</a>
              </Link>
            </div>
            <nav className="hidden lg:block">
              <ul className="flex gap-10">
                <li>
                  <Link href="/dashboard">
                    <a className="text-primaryFocus text-sm text-semibold">
                      Dashboard
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard">
                    <a className="text-white text-sm text-semibold">
                      Admin Management
                    </a>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className="block lg:hidden">
            <Icon
              name="menu"
              className="text-white"
              onClick={handleHamburgerClick}
            />
          </div>
          <div className="hidden gap-5 items-center lg:flex">
            <NotificationBar data={notifications} />
            <UserDropdown
              name={user.fullname}
              role={user.role}
              tenant={user.tenantName}
              institution={user.institutionName}
              photo={user.profilePicture}
            />
          </div>
        </div>
      </header>
    </section>
  );
};

export default Header;
