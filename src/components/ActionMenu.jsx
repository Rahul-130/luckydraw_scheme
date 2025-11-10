import React, { useState } from 'react';
import { IconButton, Menu } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const ActionMenu = ({ children }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        aria-label="more"
        id="long-button"
        aria-controls={open ? 'long-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {React.Children.map(children, (child) => React.cloneElement(child, { onClick: () => { child.props.onClick(); handleClose(); } }))}
      </Menu>
    </>
  );
};

export default ActionMenu;