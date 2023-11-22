import headerRightTpl from '/src/components/header-right.json'

const React = amisRequire('react')
const amisLib = amisRequire('amis')

class HeaderRight extends React.Component {
  render() {
      return this.props.render('header-right', headerRightTpl)
  }
}

amisLib.Renderer({
  type: 'header-right',
  autoVar: true
})(HeaderRight)
