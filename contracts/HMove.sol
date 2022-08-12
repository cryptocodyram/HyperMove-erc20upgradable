// SPDX-License-Identifier: MIT
pragma solidity =0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract HyperMoveUpgradeable is
    Initializable,
    ERC20Upgradeable,
    PausableUpgradeable,
    OwnableUpgradeable,
    ERC20PermitUpgradeable,
    ERC20VotesUpgradeable
{
    /// @notice Initialize The Vibe Token Contract
    function initialize() public initializer {
        __ERC20_init("HyperMove", "HMove");
        __Pausable_init();
        __Ownable_init();
        __ERC20Permit_init("HMove");
        __ERC20Votes_init();

        _mint(msg.sender, 1000000000 * 10**decimals());
    }

    /// @notice pause the whole token contract
    /// @dev could be executed by current owner

    function pause() public onlyOwner {
        _pause();
    }

    /// @notice unpause the token contract
    /// @dev could be executed by current owner

    function unpause() public onlyOwner {
        _unpause();
    }

    /// @inheritdoc ERC20Upgradeable

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }

    /// @inheritdoc ERC20Upgradeable

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._afterTokenTransfer(from, to, amount);
    }

    /// @inheritdoc ERC20Upgradeable

    function _mint(address to, uint256 amount)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        super._mint(to, amount);
    }

    /// @inheritdoc ERC20Upgradeable

    function _burn(address account, uint256 amount)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        super._burn(account, amount);
    }

    /// @notice burn particular user vibe tokens
    /// @dev could be executed by current owner
    /// @param account The user wallet address
    /// @param amount The amount to burn
    /// @return The Succeced/Failure Status

    function burn(address account, uint256 amount)
        external
        onlyOwner
        returns (bool)
    {
        _burn(account, amount);
        return true;
    }

    /// @notice mint vibe tokens to particular EOA
    /// @dev could be executed by current owner
    /// @param account The user wallet address
    /// @param amount The amount to mint
    /// @return The succeced/failure status

    function mint(address account, uint256 amount)
        external
        onlyOwner
        returns (bool)
    {
        _mint(account, amount);
        return true;
    }
}