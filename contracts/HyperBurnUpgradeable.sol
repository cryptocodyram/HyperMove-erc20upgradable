// SPDX-License-Identifier: MIT

pragma solidity =0.8.10;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract HyperBurnUpgradeable is
  Initializable,
  ERC20Upgradeable,
  OwnableUpgradeable
{
  function initialize() external initializer {
    __ERC20_init("HyperBurn", "HBurn");
    __Ownable_init();
  }

  function mint(address minterAddress, uint256 amount) external onlyOwner {
    _mint(minterAddress, amount);
  }

  function burn(address account, uint256 amount) external onlyOwner {
    _burn(account, amount);
  }
}
